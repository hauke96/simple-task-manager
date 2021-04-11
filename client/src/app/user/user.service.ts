import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from './user.material';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public cache: Map<string, User> = new Map<string, User>();

  constructor(
    private http: HttpClient
  ) {
  }

  public getUsersByIds(userIds: string[]): Observable<User[]> {
    const [cachedUsers, uncachedUsers] = this.getFromCacheById(userIds);
    if (uncachedUsers.length === 0) {
      return of(cachedUsers);
    }

    const url = environment.osm_api_url + '/users?users=' + uncachedUsers.join(',');

    // TODO handle case of removed account: Here a comma separated list of users will return a 404 when one UID doesn't exist anymore
    // The users API support JSON
    return this.http.get(url, {headers: {ContentType: 'application/json'}}).pipe(
      map(result => {
        const loadedUsers = this.extractUserFromJsonResult(result);
        loadedUsers.forEach(u => this.cache.set(u.uid, u));
        return cachedUsers.concat(loadedUsers);
      })
    );
  }

  public getUserByName(userName: string): Observable<User> {
    const cachedUser = this.getFromCacheByName(userName);
    if (!!cachedUser) {
      return of(cachedUser);
    }

    // Unfortunately these endpoints to not support JSON as response format
    const changesetUrl = environment.osm_api_url + '/changesets?display_name=' + userName;
    const notesUrl = environment.osm_api_url + '/notes/search?display_name=' + userName;

    return this.http.get(changesetUrl, {responseType: 'text', headers: {ContentType: 'application/xml'}}).pipe(
      map(result => {
        const userFromXml = this.extractUserFromXmlResult(result, 'changeset', 'user', 'uid');
        if (!userFromXml || !userFromXml[0]) {
          throw new Error('User \'' + userName + '\' not found in changesets');
        }

        const user = userFromXml[0];
        this.cache.set(user.uid, user);
        return user;
      }),
      catchError((e: HttpErrorResponse) => {
        // This error might occur when the user hasn't created a changeset yet. Therefore we don't use the error service here.
        console.error('Error getting UID via changeset API:');
        console.error(e);

        // Second try, this time via the notes API
        return this.http.get(notesUrl, {responseType: 'text', headers: {ContentType: 'application/xml'}}).pipe(
          map(result => {
            const user = this.extractDataFromComment(result, userName);
            if (!user) {
              throw new Error('User \'' + userName + '\' not found in notes');
            }
            this.cache.set(user.uid, user);
            return user;
          })
        );
      })
    );
  }

  // Takes the name of a XML-node (e.g. "user" or "changeset" and finds the according attribute
  private extractUserFromXmlResult(xmlString: string, nodeQualifier: string, nameQualifier: string, idQualifier: string)
    : User[] | undefined {
    if (window.DOMParser) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString('' + xmlString, 'application/xml');
      const userNodes = xmlDoc.getElementsByTagName(nodeQualifier);

      const userNames: User[] = [];
      for (let i = 0; i < userNodes.length; i++) {
        // @ts-ignore
        const name = userNodes[i].attributes.getNamedItem(nameQualifier).value;
        // @ts-ignore
        const uid = userNodes[i].attributes.getNamedItem(idQualifier).value;
        userNames[i] = new User(name, uid);
      }

      return userNames;
    }

    return undefined;
  }

  private extractUserFromJsonResult(result: any): User[] {
    const users = [];
    for (const u of result.users) {
      const name = u?.user?.display_name;
      const uid = u?.user?.id;
      users.push(new User(name, '' + uid));
    }
    return users;
  }

  private extractDataFromComment(xmlString: string, userName: string): User | undefined {
    if (window.DOMParser) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString('' + xmlString, 'application/xml');
      const note = xmlDoc.getElementsByTagName('note')[0];
      const comments = note.getElementsByTagName('comments');
      const commentNodes = comments[0].getElementsByTagName('comment');

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < commentNodes.length; i++) {
        // Check whether the user of the comment is the user we search for
        const name = (commentNodes[i].getElementsByTagName('user'))[0].textContent;
        if (name === userName) {
          const uid = commentNodes[i].getElementsByTagName('uid')[0].textContent;
          if (!!uid) {
            return new User(name, uid);
          }
        }
      }
    }
    return undefined;
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
