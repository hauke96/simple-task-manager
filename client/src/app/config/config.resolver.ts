import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Config } from './config';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConfigProvider } from './config.provider';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfigResolver implements Resolve<Config> {
  constructor(private httpClient: HttpClient,
              private configProvider: ConfigProvider) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Config> {
    return this.httpClient.get<Config>(environment.url_config).pipe(tap(config => {
      this.configProvider.apply(config);
    }));
  }
}
