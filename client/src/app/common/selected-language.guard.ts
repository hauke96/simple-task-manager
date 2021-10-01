import { Injectable } from '@angular/core';
import { CanActivate, CanLoad } from '@angular/router';
import { SelectedLanguageService } from './services/selected-language.service';
import { environment } from '../../environments/environment';

@Injectable()
export class SelectedLanguageGuard implements CanActivate {
  constructor(private selectedLanguageService: SelectedLanguageService) {
  }

  canActivate() {
    // Don't care about language redirect when working locally (when "production === false")
    return !environment.production || this.selectedLanguageService.loadLanguageFromLocalStorage();
  }
}
