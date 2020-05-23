import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { User } from './user.material';

describe('UserService', () => {
  let service: UserService;
  let userMap: Map<string, User>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(UserService);

    userMap = new Map<string, User>();
    userMap.set('1', new User('test1', '1'));
    userMap.set('2', new User('test2', '2'));
    userMap.set('4', new User('test3', '3'));
    service.cache = userMap;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get uncached users by IDs', () => {
    const [cachedUsers, uncachedUsers] = service.getFromCacheById(['2', '3', '4', '5']);

    expect(cachedUsers).toContain(userMap.get('2'));
    expect(cachedUsers).toContain(userMap.get('4'));
    expect(uncachedUsers).toContain('3');
    expect(uncachedUsers).toContain('5');
  });

  it('should get uncached user by name', () => {
    let user = service.getFromCacheByName('test5');
    expect(user).toEqual(undefined);

    user = service.getFromCacheByName('test2');
    expect(user).toEqual(userMap.get('2'));
  });
});
