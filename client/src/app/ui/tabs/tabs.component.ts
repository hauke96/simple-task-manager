import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {
  @Input() tabs: string[];

  /**
   * When set to true, there'll be only a border between the tabs and the content but no border around the content.
   */
  @Input() borderless = false;

  @Output() tabSelected = new EventEmitter<number>();

  public tabTitle: string;
  public tabIndex: number;

  constructor() {
  }

  ngOnInit(): void {
    this.tabIndex = 0;
    this.tabTitle = this.tabs[this.tabIndex];
  }

  public onTabClicked(tabTitle: string): void {
    this.tabIndex = this.tabs.indexOf(tabTitle);
    this.tabTitle = tabTitle;

    this.tabSelected.emit(this.tabIndex);
  }
}
