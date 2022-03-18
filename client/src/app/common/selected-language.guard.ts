import { Injectable } from '@angular/core';
import { CanActivate, CanLoad } from '@angular/router';
import { SelectedLanguageService } from './services/selected-language.service';
import { environment } from '../../environments/environment';

@Injectable()
export class SelectedLanguageGuard implements CanActivate {
  constructor(private selectedLanguageService: SelectedLanguageService) {
  }

  public canActivate(): boolean {
    // Don't care about language redirect when working locally (when "production === false")
    return this.selectedLanguageService.loadLanguageFromLocalStorage();
  }
}
