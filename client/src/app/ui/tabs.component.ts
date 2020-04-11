import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {
  @Input() tabs: string[];

  public tabTitle: string;
  public tabIndex: number;

  constructor() {
  }

  ngOnInit(): void {
    this.tabIndex = 0;
    this.tabTitle = this.tabs[this.tabIndex];
  }

  public onTabClicked(tabTitle: string) {
    this.tabIndex = this.tabs.indexOf(tabTitle);
    this.tabTitle = tabTitle;
  }
}
