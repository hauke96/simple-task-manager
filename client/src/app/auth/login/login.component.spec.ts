import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe(LoginComponent.name, () => {
  let component: LoginComponent;
  let fixture: MockedComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;
  let httpClient: HttpClient;
  let translationService: TranslateService;

  beforeEach(() => {
    router = {} as Router;
    router.navigate = jest.fn();

    httpClient = {} as HttpClient;
    httpClient.get = jest.fn().mockReturnValue(of());

    authService = {} as AuthService;
    translationService = {
      onLangChange: of(),
    } as unknown as TranslateService;

    return MockBuilder(LoginComponent, AppModule)
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: AuthService, useFactory: () => authService})
      .provide({provide: HttpClient, useFactory: () => httpClient})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(LoginComponent);
    component = fixture.point.componentInstance;
    // @ts-ignore
    fixture.ngZone.run = (fn) => fn();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect user to dashboard after login', () => {
    authService.requestLogin = (fn) => fn();
    router.navigate = jest.fn();

    component.onLoginButtonClick();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  // TODO test for language change to re-load template
});
