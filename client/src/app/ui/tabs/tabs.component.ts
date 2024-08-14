import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TabItem {
  index: number;
  title: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent {
  /**
   * When set to true, there'll be only a border between the tabs and the content but no border around the content.
   */
  @Input() borderless = false;

  @Output() tabSelected = new EventEmitter<number>();

  public selectedTabIndex = 0;

  private currentTabs: TabItem[];

  public get tabs(): TabItem[] {
    return this.currentTabs;
  }

  @Input()
  public set tabs(titles: string[]) {
    this.currentTabs = titles.map((title, index) => ({index, title} as TabItem));
  }

  public selectTab(tabIndex: number): void {
    this.selectedTabIndex = tabIndex;
    this.tabSelected.emit(this.selectedTabIndex);
  }
}
