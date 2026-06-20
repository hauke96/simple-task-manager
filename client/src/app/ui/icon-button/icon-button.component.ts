import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class IconButtonComponent {
  @Input()
  public icon: string;

  @Input()
  public textKey: string;

  @Input()
  public disabled = false;

  @Output()
  public clicked = new EventEmitter<MouseEvent>();
}
