import { CommentService } from './comment.service';
import { UserService } from '../user/user.service';

describe(CommentService.name, () => {
  let service: CommentService;
  let userService: UserService;

  beforeEach(() => {
    userService = {} as UserService;

    service = new CommentService(userService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // TODO Tests
});
