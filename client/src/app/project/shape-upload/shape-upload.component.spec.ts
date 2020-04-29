import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeUploadComponent } from './shape-upload.component';
import { ErrorService } from '../../common/error.service';

const exampleGpxFile = `
<gpx>
  <wpt lat="53.55425510342779" lon="9.945566643476486">
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="53.559532123118686" lon="9.942970232963562">
      </trkpt>
      <trkpt lat="53.55713588559855" lon="9.943098978996275">
      </trkpt>
      <trkpt lat="53.55718687078871" lon="9.946489291191103">
      </trkpt>
      <trkpt lat="53.559481140754805" lon="9.94631762981415">
      </trkpt>
      <trkpt lat="53.559532123118686" lon="9.942970232963562">
      </trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="53.55711039298042" lon="9.949493365287783">
      </trkpt>
      <trkpt lat="53.559608596549324" lon="9.950737910270691">
      </trkpt>
      <trkpt lat="53.55698292965938" lon="9.952583270072939">
      </trkpt>
      <trkpt lat="53.55711039298042" lon="9.949493365287783">
      </trkpt>
    </trkseg>
  </trk>
  <rte>
      <rtept lat="53.55945564954981" lon="9.95498652935028">
      </rtept>
      <rtept lat="53.557084900346936" lon="9.957175211906435">
      </rtept>
      <rtept lat="53.55726334845877" lon="9.960865931510925">
      </rtept>
      <rtept lat="53.55981252502185" lon="9.961295084953308">
      </rtept>
      <rtept lat="53.55967230518426" lon="9.959439028501508">
      </rtept>
  </rte>
</gpx>
`;

describe('ShapeUploadComponent', () => {
  let component: ShapeUploadComponent;
  let fixture: ComponentFixture<ShapeUploadComponent>;
  let errorService: ErrorService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeUploadComponent]
    })
      .compileComponents();

    errorService = TestBed.inject(ErrorService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read GPX file', () => {
    const features = component.fileToFeatures('example.gpx', exampleGpxFile);

    expect(features.length).toEqual(3);
  });

  it('should fail on unknown file extension', () => {
    expect(() => component.fileToFeatures('example.foo', '')).toThrow();
  });
});
