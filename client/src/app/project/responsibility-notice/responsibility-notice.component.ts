import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-responsibility-notice',
  templateUrl: './responsibility-notice.component.html',
  styleUrls: ['./responsibility-notice.component.scss']
})
export class ResponsibilityNoticeComponent implements OnInit {
  public checkBlindCopy: boolean;
  public checkStickToWiki: boolean;
  public checkHashtags: boolean;
  public checkOpenMinded: boolean;

  @Output() public proceed: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit(): void {
  }

  public get canProceed(): boolean {
    return this.checkBlindCopy && this.checkStickToWiki && this.checkHashtags && this.checkOpenMinded;
  }

  public okClicked() {
    this.proceed.emit();
  }
}
