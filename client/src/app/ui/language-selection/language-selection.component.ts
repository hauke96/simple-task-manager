import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Language } from '../../common/entities/language';
import { SelectedLanguageService } from '../../common/services/selected-language.service';

@Component({
  selector: 'app-language-selection',
  templateUrl: './language-selection.component.html',
  styleUrls: ['./language-selection.component.scss']
})
export class LanguageSelectionComponent implements OnInit {
  languages: Language[] = [];

  constructor(private route: ActivatedRoute, private selectedLanguageService: SelectedLanguageService) {
  }

  ngOnInit(): void {
    this.languages = this.selectedLanguageService.getKnownLanguages();
  }

  get selectedLanguage(): Language | undefined {
    return this.selectedLanguageService.getSelectedLanguage();
  }

  onLanguageChange(event: any): void {
    this.selectedLanguageService.selectLanguageByCode(event.target.value);
  }
}
