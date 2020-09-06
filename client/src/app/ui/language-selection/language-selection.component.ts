import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export class Language {
  constructor(public code: string, public name: string) {
  }
}

@Component({
  selector: 'app-language-selection',
  templateUrl: './language-selection.component.html',
  styleUrls: ['./language-selection.component.scss']
})
export class LanguageSelectionComponent implements OnInit {
  languages = [
    new Language('en-US', 'English'),
    new Language('de', 'Deutsch'),
    new Language('ja', '日本人'),
    new Language('zh-CN', '中文'),
  ];
  selectedLanguage: Language;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.selectLanguageByUrl(location.pathname.split('/'));
  }

  selectLanguageByUrl(url: string[]) {
    const allLangCodes = this.languages.map(l => l.code);

    if (!url || url.length === 0 || !allLangCodes.includes(url[0])) {
      this.selectedLanguage = this.languages[0]; // en-US as default
    } else {
      this.selectedLanguage = this.languages.find(l => l.code === url[0]);
    }
  }

  onLanguageChange() {
    // The trailing '/' is important, otherwise the angular router will say "I don't know this route" and causes an error.
    location.href = location.origin + '/' + this.selectedLanguage.code + '/';
  }
}
