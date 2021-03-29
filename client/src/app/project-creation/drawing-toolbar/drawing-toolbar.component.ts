import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { ShortcutService } from '../../common/shortcut.service';
import { Unsubscriber } from '../../common/unsubscriber';

@Component({
  selector: 'app-drawing-toolbar',
  templateUrl: './drawing-toolbar.component.html',
  styleUrls: ['./drawing-toolbar.component.scss']
})
export class DrawingToolbarComponent extends Unsubscriber implements OnInit {
  public readonly SELECTION_DRAW = 'draw';
  public readonly SELECTION_EDIT = 'edit';
  public readonly SELECTION_DELETE = 'delete';

  public selectedButton: string;

  @Input() public resetSelection: Subject<void>;
  @Input() public canAddTasks: boolean;

  @Output() public buttonDraw: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonEdit: EventEmitter<void> = new EventEmitter<void>();
  @Output() public buttonDelete: EventEmitter<void> = new EventEmitter<void>();

  constructor(private shortcutService: ShortcutService) {
    super();
  }

  ngOnInit(): void {
    this.unsubscribeLater(
      this.resetSelection.subscribe(() => {
        this.selectedButton = undefined;
      }),
      this.shortcutService.add('d').subscribe(() => {
        this.onButtonDraw();
      }),
      this.shortcutService.add('shift.d').subscribe(() => {
        this.onButtonDelete();
      }),
      this.shortcutService.add('e').subscribe(() => {
        this.onButtonEdit();
      }),
      this.shortcutService.add('esc').subscribe(() => {
        this.onCurrentActiveButton();
      })
    );
  }

  /**
   * Deselects the currently active/selected button.
   */
  private onCurrentActiveButton() {
    switch (this.selectedButton) {
      case this.SELECTION_DRAW:
        this.onButtonDraw();
        break;
      case this.SELECTION_DELETE:
        this.onButtonDelete();
        break;
      case this.SELECTION_EDIT:
        this.onButtonEdit();
        break;
    }
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
