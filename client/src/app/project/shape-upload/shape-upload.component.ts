import { Component, OnInit } from '@angular/core';
import { ErrorService } from '../../common/error.service';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {

  constructor(
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
  }

  public onFileSelected(event: any) {
    const reader = new FileReader();
    reader.readAsText(event.target.files[0], 'UTF-8');

    reader.onload = (evt) => {
      // TODO use service to turn file into polygons
      console.log(evt.target.result);
    };
    reader.onerror = (evt) => {
      console.error(evt);
      this.errorService.addError('Could not upload file \'${evt.target.files[0]}\'');
    };
  }
}
