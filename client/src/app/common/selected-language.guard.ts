import { Injectable } from '@angular/core';
import { CanActivate, CanLoad } from '@angular/router';
import { LanguageService } from './services/language.service';
import { environment } from '../../environments/environment';

@Injectable()
export class SelectedLanguageGuard implements CanActivate {
  constructor(private languageService: LanguageService) {
  }

  public canActivate(): boolean {
    // Don't care about language redirect when working locally (when "production === false")
    return this.languageService.loadLanguageFromLocalStorage();
  }
}
