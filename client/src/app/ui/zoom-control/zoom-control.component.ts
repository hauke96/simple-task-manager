import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-zoom-control',
    templateUrl: './zoom-control.component.html',
    styleUrls: ['./zoom-control.component.scss'],
    standalone: false
})
export class ZoomControlComponent implements OnInit {

  @Output() public buttonZoomIn: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonZoomOut: EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  public onButtonZoomIn() {
    this.buttonZoomIn.emit();
  }

  public onButtonZoomOut() {
    this.buttonZoomOut.emit();
  }
}
