import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-drawing-toolbar',
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss']
})
export class DrawingToolbarComponent implements OnInit {
  public readonly SELECTION_DRAW = 'draw';
  public readonly SELECTION_EDIT = 'edit';
  public readonly SELECTION_DELETE = 'delete';

  public selectedButton: string;

  @Input() public resetSelection: Subject<void>;
  @Input() public canAddTasks: boolean;

  @Output() public buttonDraw: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonEdit: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonDelete: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit(): void {
    this.resetSelection.subscribe(() => {
      this.selectedButton = undefined;
    });
  }

  public onButtonDraw() {
    this.buttonDraw.emit();

    if (this.selectedButton !== this.SELECTION_DRAW) {
      this.selectedButton = this.SELECTION_DRAW;
    } else {
      this.selectedButton = undefined;
    }
  }

  public onButtonEdit() {
    this.buttonEdit.emit();

    if (this.selectedButton !== this.SELECTION_EDIT) {
      this.selectedButton = this.SELECTION_EDIT;
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
