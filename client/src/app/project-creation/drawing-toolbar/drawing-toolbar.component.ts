import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-drawing-toolbar',
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss']
})
export class DrawingToolbarComponent implements OnInit {

  @Output() public buttonZoomIn: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonZoomOut: EventEmitter<void> = new EventEmitter<void>();

  @Output() public buttonDraw: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonDelete: EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  public onButtonZoomIn() {
    this.buttonZoomIn.emit();
  }

  public onButtonZoomOut() {
    this.buttonZoomOut.emit();
  }

  public onButtonDraw() {
    this.buttonDraw.emit();
  }

  public onButtonDelete() {
    this.buttonDelete.emit();
  }
}
