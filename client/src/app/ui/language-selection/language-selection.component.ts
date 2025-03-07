import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Language } from '../../common/entities/language';
import { LanguageService } from '../../common/services/language.service';

@Component({
    selector: 'app-language-selection',
    templateUrl: './language-selection.component.html',
    styleUrls: ['./language-selection.component.scss'],
    standalone: false
})
export class LanguageSelectionComponent implements OnInit {
  languages: Language[] = [];

  constructor(private route: ActivatedRoute, private languageService: LanguageService) {
  }

  ngOnInit(): void {
    this.languages = this.languageService.getKnownLanguages();
  }

  get selectedLanguage(): Language | undefined {
    return this.languageService.getSelectedLanguage();
  }

  onLanguageChange(event: any): void {
    this.languageService.selectLanguageByCode(event.target.value);
  }
}
