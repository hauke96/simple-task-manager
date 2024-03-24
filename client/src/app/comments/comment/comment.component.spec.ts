import { CommentComponent } from './comment.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

describe(CommentComponent.name, () => {
  let component: CommentComponent;
  let fixture: MockedComponentFixture<CommentComponent>;

  beforeEach(async () => {
    return MockBuilder(CommentComponent);
  });

  beforeEach(() => {
    fixture = MockRender(CommentComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
