import { Component, OnInit } from '@angular/core';

export class Language {
  constructor(code: string, name: string) {
  }
}

@Component({
  selector: 'app-language-selection',
  templateUrl: './language-selection.component.html',
  styleUrls: ['./language-selection.component.scss']
})
export class LanguageSelectionComponent implements OnInit {
  languages = [
    new Language('en', 'English'),
    new Language('de', 'Deutsch'),
    new Language('ja', '日本人'),
    new Language('zh-cn', '中文'),
  ];
  selectedLanguage: Language;

  constructor() {
  }

  ngOnInit(): void {
  }

  onLanguageChange() {
    console.log(this.selectedLanguage);
  }
}
