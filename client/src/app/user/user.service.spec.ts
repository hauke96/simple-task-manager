import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { User } from './user.material';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

const userList = `
<osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <user id="1" display_name="foo" account_created="2001-01-01T01:01:01Z">
  <description/>
    <contributor-terms agreed="false"/>
    <roles> </roles>
    <changesets count="0"/>
    <traces count="0"/>
    <blocks>
        <received count="0" active="0"/>
    </blocks>
  </user>
  <user id="2" display_name="bar" account_created="2002-02-02T02:02:02Z">
    <description/>
    <contributor-terms agreed="true"/>
    <roles> </roles>
    <changesets count="1"/>
    <traces count="0"/>
    <blocks>
        <received count="0" active="0"/>
    </blocks>
  </user>
</osm>
`;

const changesets = `
<osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <changeset id="123" created_at="2020-05-25T10:23:09Z" open="false" comments_count="0" changes_count="7" closed_at="2020-05-25T10:23:09Z" min_lat="0" min_lon="0" max_lat="1" max_lon="1" uid="1" user="foo">
    <tag k="changesets_count" v="1"/>
    <tag k="imagery_used" v="Esri World Imagery"/>
    <tag k="locale" v="de"/>
    <tag k="host" v="https://www.openstreetmap.org/edit"/>
    <tag k="created_by" v="simple-task manager of course ;)"/>
    <tag k="comment" v="some comment"/>
  </changeset>
</osm>
`;

const comments = `
<osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <note lon="9" lat="53">
  <id>234</id>
  <url>
    https://master.apis.dev.openstreetmap.org/api/0.6/notes/234
  </url>
  <comment_url>
    https://master.apis.dev.openstreetmap.org/api/0.6/notes/234/comment
  </comment_url>
  <close_url>
    https://master.apis.dev.openstreetmap.org/api/0.6/notes/234/close
  </close_url>
  <date_created>2020-05-18 19:19:44 UTC</date_created>
  <status>open</status>
  <comments>
    <comment>
      <date>2020-05-18 19:19:44 UTC</date>
      <uid>1</uid>
      <user>foo</user>
      <user_url>
        https://master.apis.dev.openstreetmap.org/user/foo
      </user_url>
      <action>opened</action>
      <text>foo</text>
      <html><p>foo</p></html>
    </comment>
  </comments>
  </note>
</osm>
`;
const invalidComments = `
<osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <note lon="9" lat="53">
  <comments>
    <commentoInvalido>
      <date>2020-05-18 19:19:44 UTC</date>
      <uid>1</uid>
      <user>foo</user>
      <user_url>
        https://master.apis.dev.openstreetmap.org/user/foo
      </user_url>
      <action>opened</action>
      <text>foo</text>
      <html><p>foo</p></html>
    </commentoInvalido>
  </comments>
  </note>
</osm>
`;

describe('UserService', () => {
  let service: UserService;
  let userMap: Map<string, User>;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get uncached users by IDs', () => {
    fillCacheWithDummyData();

    const [cachedUsers, uncachedUsers] = service.getFromCacheById(['2', '3', '4', '5']);

    expect(cachedUsers).toContain(userMap.get('2'));
    expect(cachedUsers).toContain(userMap.get('4'));
    expect(uncachedUsers).toContain('3');
    expect(uncachedUsers).toContain('5');
  });

  it('should get uncached user by name', () => {
    fillCacheWithDummyData();

    service.getUserByName('test5').subscribe(
      user => {
        expect(user).toEqual(undefined);
      },
      () => fail());

    service.getUserByName('test2').subscribe(
      user => {
        expect(user).toEqual(userMap.get('2'));
      },
      () => fail());
  });

  it('should parse user list to get users by ID correctly', () => {
    spyOn(httpClient, 'get').and.returnValue(of(userList));

    service.getUsersByIds(['1', '2']).subscribe(
      u => {
        expect(u.length).toEqual(2);
        expect(u[0].uid).toEqual('1');
        expect(u[0].name).toEqual('foo');
        expect(u[1].uid).toEqual('2');
        expect(u[1].name).toEqual('bar');
        expect(service.cache.has(u[0].uid));
        expect(service.cache.has(u[1].uid));
        expect(service.cache.get('1')).toEqual(u[0]);
        expect(service.cache.get('2')).toEqual(u[1]);
      },
      () => fail());
  });

  it('should use cache on hit', () => {
    const httpSpy = spyOn(httpClient, 'get').and.callThrough();

    fillCacheWithDummyData();

    service.getUsersByIds(['1', '2']).subscribe(u => {
        expect(u.length).toEqual(2);
        expect(u[0].uid).toEqual('1');
        expect(u[0].name).toEqual('test1');
        expect(u[1].uid).toEqual('2');
        expect(u[1].name).toEqual('test2');
        expect(service.cache.has(u[0].uid));
        expect(service.cache.has(u[1].uid));
        expect(service.cache.get('1')).toEqual(u[0]);
        expect(service.cache.get('2')).toEqual(u[1]);
        expect(httpSpy).not.toHaveBeenCalled();
      },
      e => {
        console.error(e);
        fail();
      });
  });

  it('should find UID via changesets by given name correctly', () => {
    spyOn(httpClient, 'get').and.returnValue(of(changesets));

    service.getUserByName('foo').subscribe(user => {
        expect(user).toBeTruthy();
        expect(user.uid).toEqual('1');
        expect(user.name).toEqual('foo');
        expect(service.cache.has(user.uid));
        expect(service.cache.get('1')).toEqual(user);
      },
      e => {
        console.error(e);
        fail();
      });
  });

  it('should find UID via comments by given name correctly', () => {
    // @ts-ignore
    spyOn(httpClient, 'get').and.callFake((url: string, options: {}) => {
      if (url.includes('notes')) {
        return of(comments);
      }
      return of('Not found');
    });

    service.getUserByName('foo').subscribe(user => {
        expect(user).toBeTruthy();
        expect(user.uid).toEqual('1');
        expect(user.name).toEqual('foo');
        expect(service.cache.has(user.uid));
        expect(service.cache.get('1')).toEqual(user);
      },
      e => {
        console.error(e);
        fail();
      });
  });

  it('should return error when user not found', () => {
    spyOn(httpClient, 'get').and.returnValue(of('Not found'));

    service.getUserByName('foo').subscribe(
      () => fail(),
      (e: Error) => {
        expect(service.cache.size).toEqual(0);
      }
    );
  });

  it('should return error on invalid comment XML', () => {
    // @ts-ignore
    spyOn(httpClient, 'get').and.callFake((url: string, options: {}) => {
      if (url.includes('notes')) {
        return of(invalidComments);
      }
      return of('Not found');
    });

    service.getUserByName('foo').subscribe(
      () => fail(),
      (e: Error) => {
        expect(service.cache.size).toEqual(0);
      }
    );
  });

  function fillCacheWithDummyData() {
    userMap = new Map<string, User>();
    userMap.set('1', new User('test1', '1'));
    userMap.set('2', new User('test2', '2'));
    userMap.set('4', new User('test3', '3'));
    service.cache = userMap;
  }
});
