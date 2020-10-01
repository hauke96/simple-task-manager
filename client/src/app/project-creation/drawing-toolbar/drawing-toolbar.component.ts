import { Component, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-drawing-toolbar',
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss']
})
export class DrawingToolbarComponent implements OnInit {

  public buttonZoomIn: EventEmitter<void> = new EventEmitter<void>();
  public buttonZoomOut: EventEmitter<void> = new EventEmitter<void>();

  public buttonDraw: EventEmitter<void> = new EventEmitter<void>();
  public buttonDelete: EventEmitter<void> = new EventEmitter<void>();

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
