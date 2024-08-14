import { CommentService } from './comment.service';
import { CommentDto } from './comment.material';
import { User } from '../user/user.material';

describe(CommentService.name, () => {
  let service: CommentService;

  beforeEach(() => {
    service = new CommentService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly convert DTO', () => {
    const dtos = [
      new CommentDto(123, 'some text', 'author1', '2024-03-27 10:00'),
      new CommentDto(234, 'some other text', 'author2', '2024-03-27 11:00')
    ];
    const userMap = new Map([
      ['author2', new User('Peter', 'author2')],
      ['author1', new User('Anna', 'author1')],
    ]);

    const comments = service.toCommentsWithUserMap(dtos, userMap);

    expect(comments.length).toEqual(2);

    expect(comments[0].id).toEqual(dtos[0].id);
    expect(comments[0].text).toEqual(dtos[0].text);
    expect(comments[0].author).toEqual(userMap.get('author1') as User);
    expect(comments[0].creationDate).toEqual(new Date(dtos[0].creationDate));

    expect(comments[1].id).toEqual(dtos[1].id);
    expect(comments[1].text).toEqual(dtos[1].text);
    expect(comments[1].author).toEqual(userMap.get('author2') as User);
    expect(comments[1].creationDate).toEqual(new Date(dtos[1].creationDate));
  });
});
