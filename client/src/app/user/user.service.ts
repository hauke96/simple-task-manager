import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // TODO Add a cache for the names

  constructor(
    private http: HttpClient
  ) {
  }

  public getUserNames(userIds: string[]): Observable<string[]> {
    const url = environment.osm_api_url + '/users?users=' + userIds.join(',');

    return this.http.get(url, {responseType: 'text'}).pipe(
      map(result => {
        return this.extractDataFromXmlAttributes(result, 'user', 'display_name');
      })
    );
  }

  public getUserId(userName: string): Observable<string> {
    const changesetUrl = environment.osm_api_url + '/changesets?display_name=' + userName;
    const notesUrl = environment.osm_api_url + '/notes/search?display_name=' + userName;

    return this.http.get(changesetUrl, {responseType: 'text'}).pipe(
      map(result => {
        return this.extractDataFromXmlAttributes(result, 'changeset', 'uid')[0];
      }),
      catchError((e: HttpErrorResponse) => {
        // This error might occur when the user hasn't created a changeset yet. Therefore we don't use the error service here.
        console.error('Error getting UID via changeset API:');
        console.error(e);

        // Second try, this time via the notes API
        return this.http.get(notesUrl, {responseType: 'text'}).pipe(
          map(result => {
            return this.extractDataFromComment(result, userName);
          })
        );
      })
    );
  }

  // Takes the name of a XML-node (e.g. "user" or "changeset" and finds the according attribute
  private extractDataFromXmlAttributes(xmlString: string, nodeQualifier: string, attributeQualifier: string): string[] {
    if (window.DOMParser) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString('' + xmlString, 'application/xml');
      const userNodes = xmlDoc.getElementsByTagName(nodeQualifier);

      const userNames: string[] = [];
      for (let i = 0; i < userNodes.length; i++) {
        userNames[i] = userNodes[i].attributes.getNamedItem(attributeQualifier).value;
      }

      return userNames;
    }
    return null;
  }

  private extractDataFromComment(xmlString: string, userName: string): string {
    if (window.DOMParser) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString('' + xmlString, 'application/xml');
      const commentNodes = xmlDoc.getElementsByTagName('comment');

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < commentNodes.length; i++) {
        // Check whether the user of the comment is the user we search for
        if (commentNodes[i].getElementsByTagName('user')[0].nodeValue === userName) {
          return commentNodes[i].getElementsByTagName('uid')[0].nodeValue;
        }
      }
    }
    return null;
  }
}
