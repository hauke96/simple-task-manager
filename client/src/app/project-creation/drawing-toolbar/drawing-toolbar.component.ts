import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-drawing-toolbar',
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss']
})
export class DrawingToolbarComponent implements OnInit {
  public readonly SELECTION_DRAW = 'draw';
  public readonly SELECTION_DELETE = 'delete';

  public selectedButton: string;

  @Input() public resetSelection: Subject<void>;

  @Output() public buttonZoomIn: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonZoomOut: EventEmitter<void> = new EventEmitter<void>();

  @Output() public buttonDraw: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonDelete: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit(): void {
    this.resetSelection.subscribe(() => {
      this.selectedButton = undefined;
    });
  }

  public onButtonZoomIn() {
    this.buttonZoomIn.emit();
  }

  public onButtonZoomOut() {
    this.buttonZoomOut.emit();
  }

  public onButtonDraw() {
    this.buttonDraw.emit();

    if (this.selectedButton !== this.SELECTION_DRAW) {
      this.selectedButton = this.SELECTION_DRAW;
    } else {
      this.selectedButton = undefined;
    }
  }

  public onButtonDelete() {
    this.buttonDelete.emit();

    if (this.selectedButton !== this.SELECTION_DELETE) {
      this.selectedButton = this.SELECTION_DELETE;
    } else {
      this.selectedButton = undefined;
    }
  }
}
