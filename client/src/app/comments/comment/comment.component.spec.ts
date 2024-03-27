import { CommentComponent } from './comment.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { Comment } from '../comment.material';
import { User } from '../../user/user.material';
import { TranslateService } from '@ngx-translate/core';

describe(CommentComponent.name, () => {
  let component: CommentComponent;
  let fixture: MockedComponentFixture<CommentComponent, any>;
  let translationService: TranslateService;

  beforeEach(() => {
    translationService = {} as TranslateService;

    return MockBuilder(CommentComponent)
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(CommentComponent, {comments: []});
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort comment correct', () => {
    component.comments = [
      new Comment(1, 'first', new User('author', '100'), new Date('2024-03-27 00:10')),
      new Comment(3, 'third', new User('author', '100'), new Date('2024-03-27 00:30')),
      new Comment(4, 'fourth', new User('author', '100'), new Date('2024-03-27 00:40')),
      new Comment(2, 'second', new User('author', '100'), new Date('2024-03-27 00:20')),
    ];

    expect(component.currentComments.length).toEqual(4);
    // Order is reverse (youngest first) due to the UI (s. SCSS file)
    expect(component.currentComments[0].id).toEqual(4);
    expect(component.currentComments[1].id).toEqual(3);
    expect(component.currentComments[2].id).toEqual(2);
    expect(component.currentComments[3].id).toEqual(1);
  });

  it('should fires event on button click', () => {
    const sendButtonSpy = jest.fn();
    component.commentSendClicked.subscribe(sendButtonSpy);

    component.onSendButtonClicked();

    expect(sendButtonSpy).toHaveBeenCalled();
  });
});
