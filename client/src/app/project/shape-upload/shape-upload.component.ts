import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {

  constructor() {
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
      // TODO use error service
      console.error(evt);
    };
  }
}
