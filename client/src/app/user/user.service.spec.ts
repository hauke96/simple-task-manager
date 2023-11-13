import { UserService } from './user.service';
import { User } from './user.material';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ConfigProvider } from '../config/config.provider';
import { getConfiguredPackageManager } from '@angular/cli/src/utilities/config';

const userList = {
  users: [
    {
      user: {
        id: 1,
        display_name: 'foo',
        account_created: '2001-01-01T01:01:01Z',
        roles: [],
        changesets: {
          count: 0
        },
        traces: {
          count: 0
        },
      }
    },
    {
      user: {
        id: 2,
        display_name: 'bar',
        account_created: '2002-02-02T02:02:02Z',
        roles: [],
        changesets: {
          count: 0
        },
        traces: {
          count: 0
        },
      }
    }
  ]
};

const emptyChangesetResponse = `{
  "version": "0.6",
  "generator": "OpenStreetMap server",
  "copyright": "OpenStreetMap and contributors",
  "attribution": "http://www.openstreetmap.org/copyright",
  "license": "http://opendatacommons.org/licenses/odbl/1-0/",
  "changesets": []
}`;

const changesetsResponseForFoo = `{
  "version": "0.6",
  "generator": "OpenStreetMap server",
  "copyright": "OpenStreetMap and contributors",
  "attribution": "http://www.openstreetmap.org/copyright",
  "license": "http://opendatacommons.org/licenses/odbl/1-0/",
  "changesets": [
    {
      "id": 123,
      "uid": 1,
      "user": "foo",
      "tags": {
        "abc": "def"
      }
    }
  ]
}`;

const comments = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          9.9551,
          53.546
        ]
      },
      "properties": {
        "id": 22328,
        "comments": [
          {
            "date": "2020-05-18 19:19:44 UTC",
            "uid": 1,
            "user": "foo",
            "user_url": "https://master.apis.dev.openstreetmap.org/user/hauke-stieler-dev-notes",
            "action": "opened",
            "text": "foo"
          }
        ]
      }
    }
  ]
}`;
const invalidComments = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          9.9551,
          53.546
        ]
      },
      "invalido-propertido": {
        "id": 22328,
        "comments": [
          {
            "date": "2020-05-18 19:19:44 UTC",
            "uid": 1,
            "user": "foo",
            "user_url": "https://master.apis.dev.openstreetmap.org/user/hauke-stieler-dev-notes",
            "action": "opened",
            "text": "foo"
          }
        ]
      }
    }
  ]
}`;

describe(UserService.name, () => {
  let service: UserService;
  let userMap: Map<string, User>;
  let httpClient: HttpClient;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    httpClient = {} as HttpClient;
    configProvider = {} as ConfigProvider;
    service = new UserService(httpClient, configProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get uncached users by IDs', () => {
    fillCacheWithDummyData();

    const [cachedUsers, uncachedUsers] = service.getFromCacheById(['2', '3', '4', '5']);

    // @ts-ignore
    expect(cachedUsers).toContain(userMap.get('2'));
    // @ts-ignore
    expect(cachedUsers).toContain(userMap.get('4'));
    expect(uncachedUsers).toContain('3');
    expect(uncachedUsers).toContain('5');
  });

  it('should get cached user by name', done => {
    fillCacheWithDummyData();

    service.getUserByName('test2').subscribe({
      next: user => {
        // @ts-ignore
        expect(user).toEqual(userMap.get('2'));
        done();
      },
      error: e => {
        console.error(e);
      }
    });
  });

  it('should throw for HTTP responses without UIDs', done => {
    fillCacheWithDummyData();

    httpClient.get = jest.fn()
      .mockReturnValueOnce(of(emptyChangesetResponse))
      .mockReturnValueOnce(of(comments));

    service.getUserByName('test5').subscribe({
      next: () => {
        fail();
      },
      error: e => {
        console.error(e);
        done();
      }
    });
  });

  it('should parse user list to get users by ID correctly', done => {
    httpClient.get = jest.fn().mockReturnValue(of(userList));

    service.getUsersByIds(['1', '2']).subscribe({
      next: u => {
        expect(u.length).toEqual(2);
        expect(u[0].uid).toEqual('1');
        expect(u[0].name).toEqual('foo');
        expect(u[1].uid).toEqual('2');
        expect(u[1].name).toEqual('bar');
        expect(service.cache.has(u[0].uid));
        expect(service.cache.has(u[1].uid));
        expect(service.cache.get('1')).toEqual(u[0]);
        expect(service.cache.get('2')).toEqual(u[1]);
        done();
      },
      error: e => {
        console.error(e);
      }
    });
  });

  it('should use cache on hit', done => {
    httpClient.get = jest.fn();

    fillCacheWithDummyData();

    service.getUsersByIds(['1', '2']).subscribe({
      next: u => {
        expect(u.length).toEqual(2);
        expect(u[0].uid).toEqual('1');
        expect(u[0].name).toEqual('test1');
        expect(u[1].uid).toEqual('2');
        expect(u[1].name).toEqual('test2');
        expect(service.cache.has(u[0].uid));
        expect(service.cache.has(u[1].uid));
        expect(service.cache.get('1')).toEqual(u[0]);
        expect(service.cache.get('2')).toEqual(u[1]);
        expect(httpClient.get).not.toHaveBeenCalled();
        done();
      },
      error: e => {
        console.error(e);
      }
    });
  });

  it('should find UID via changesets by given name correctly', done => {
    httpClient.get = jest.fn().mockReturnValue(of(changesetsResponseForFoo));

    service.getUserByName('foo').subscribe({
      next: user => {
        expect(user).toBeTruthy();
        expect(user.uid).toEqual('1');
        expect(user.name).toEqual('foo');
        expect(service.cache.has(user.uid));
        expect(service.cache.get('1')).toEqual(user);
        done();
      },
      error: e => {
        console.error(e);
      }
    });
  });

  it('should find UID via comments by given name correctly', done => {
    // @ts-ignore
    httpClient.get = jest.fn().mockImplementation((url: string, options: {}) => {
      if (url.includes('notes')) {
        return of(comments);
      }
      return of('Not found');
    });

    service.getUserByName('foo').subscribe({
      next: user => {
        expect(user).toBeTruthy();
        expect(user.uid).toEqual('1');
        expect(user.name).toEqual('foo');
        expect(service.cache.has(user.uid));
        expect(service.cache.get('1')).toEqual(user);
        done();
      },
      error: e => {
        console.error(e);
      }
    });
  });

  it('should return error when user not found', done => {
    httpClient.get = jest.fn().mockReturnValue(of('Not found'));

    service.getUserByName('foo').subscribe({
      next: () => fail(),
      error: e => {
        console.error(e);
        done();
      }
    });
  });

  it('should return error on invalid comment result', done => {
    // @ts-ignore
    httpClient.get = jest.fn().mockImplementation((url: string, options: {}) => {
      if (url.includes('notes')) {
        return of(invalidComments);
      }
      return of('Not found');
    });

    service.getUserByName('foo').subscribe({
      next: () => fail(),
      error: e => {
        console.error(e);
        done();
      }
    });
  });

  function fillCacheWithDummyData(): void {
    userMap = new Map<string, User>();
    userMap.set('1', new User('test1', '1'));
    userMap.set('2', new User('test2', '2'));
    userMap.set('4', new User('test3', '3'));
    service.cache = userMap;
  }
});
