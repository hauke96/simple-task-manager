import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from './user.material';
import { GeoJSON } from 'ol/format';
import { ConfigProvider } from '../config/config.provider';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public cache: Map<string, User> = new Map<string, User>();

  constructor(
    private http: HttpClient,
    private config: ConfigProvider
  ) {
  }

  public getUsersByIds(userIds: string[]): Observable<User[]> {
    const [cachedUsers, uncachedUsers] = this.getFromCacheById(userIds);
    if (uncachedUsers.length === 0) {
      return of(cachedUsers);
    }

    const url = this.config.osmApiUrl + '/users?users=' + uncachedUsers.join(',');

    // TODO handle case of removed account: Here a comma separated list of users will return a 404 when one UID doesn't exist anymore
    // The users API support JSON
    return this.http.get(url, {headers: {Accept: 'application/json'}}).pipe(
      map(result => {
        const loadedUsers = this.getUsersFromUserApiResult(result);
        loadedUsers.forEach(u => this.cache.set(u.uid, u));
        return cachedUsers.concat(loadedUsers);
      })
    );
  }

  private getUsersFromUserApiResult(result: any): User[] {
    const users = [];
    for (const u of result.users) {
      const name = u?.user?.display_name;
      const uid = u?.user?.id;
      users.push(new User(name, '' + uid));
    }
    return users;
  }

  public getUserByName(userName: string): Observable<User> {
    const cachedUser = this.getFromCacheByName(userName);
    if (!!cachedUser) {
      return of(cachedUser);
    }

    const changesetUrl = this.config.osmApiUrl + '/changesets?display_name=' + userName;
    const notesUrl = this.config.osmApiUrl + '/notes/search?display_name=' + userName;

    return this.http.get(changesetUrl, {responseType: 'text', headers: {Accept: 'application/json'}}).pipe(
      map(result => {
        const uid = JSON.parse(result)?.changesets[0]?.user;
        if (uid != null) {
          const user = new User(userName, uid);
          this.cache.set(uid, user);
          return user;
        } else {
          throw new Error('User \'' + userName + '\' not found in changesets');
        }
      }),
      catchError((e: HttpErrorResponse) => {
        // This error might occur when the user hasn't created a changeset yet. Therefore we don't use the error service here.
        console.error('Error getting UID via changeset API:');
        console.error(e);

        // Second try, this time via the notes API
        return this.http.get(notesUrl, {responseType: 'text', headers: {Accept: 'application/json'}}).pipe(
          map(result => {
            console.log(new GeoJSON().readFeatures(result));
            const allNoteComments = new GeoJSON().readFeatures(result)?.flatMap(f => f.get('comments'));
            const uid = allNoteComments.filter(c => c.user === userName)[0]?.uid;
            if (!uid) {
              throw new Error('User \'' + userName + '\' not found in notes');
            }
            const user = new User(userName, uid);
            this.cache.set(uid, user);
            return user;
          })
        );
      })
    );
  }

  public getFromCacheById(userIds: string[]): [User[], string[]] {
    const cachedUsers: User[] = [];
    const uncachedUsers: string[] = [];

    for (const u of userIds) {
      const user = this.cache.get(u);
      if (!!user) {
        cachedUsers.push(user);
      } else {
        console.log('Cache miss for user \'' + u + '\'');
        uncachedUsers.push(u);
      }
    }

    return [cachedUsers, uncachedUsers];
  }

  public getFromCacheByName(userName: string): User | undefined {
    for (const u of this.cache.values()) {
      if (u.name === userName) {
        return u;
      }
    }
    return undefined;
  }
}
