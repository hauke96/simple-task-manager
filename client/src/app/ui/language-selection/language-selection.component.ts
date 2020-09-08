import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Language } from '../../common/language';
import { SelectedLanguageService } from '../../common/selected-language.service';

@Component({
  selector: 'app-language-selection',
  templateUrl: './language-selection.component.html',
  styleUrls: ['./language-selection.component.scss']
})
export class LanguageSelectionComponent implements OnInit {
  selectedLanguage: Language;
  languages: Language[] = [];

  constructor(private route: ActivatedRoute, private selectedLanguageService: SelectedLanguageService) {
    this.languages = this.selectedLanguageService.getKnownLanguages();
    this.selectedLanguage = this.selectedLanguageService.getSelectedLanguage();
    console.log(this.selectedLanguage);
  }

  ngOnInit(): void {
  }

  onLanguageChange(event: any) {
    this.selectedLanguageService.selectLanguageByCode(event.target.value);
  }
}
