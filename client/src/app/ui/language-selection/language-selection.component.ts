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
    this.selectLanguageByUrl(location.pathname);
  }

  selectLanguageByUrl(url: string) {
    url = url.replace(/^\//g, ''); // remove leading slashes
    const urlSegments = url.split('/');
    const allLangCodes = this.languages.map(l => l.code);

    if (urlSegments.length === 0 || !allLangCodes.includes(urlSegments[0])) {
      this.selectedLanguage = this.languages[0]; // en-US as default
    } else {
      this.selectedLanguage = this.languages.find(l => l.code === urlSegments[0]);
    }
  }

  onLanguageChange() {
    // The trailing '/' is important, otherwise the angular router will say "I don't know this route" and causes an error.
    location.href = location.origin + '/' + this.selectedLanguage.code + '/';
  }
}
