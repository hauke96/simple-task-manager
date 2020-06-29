This file describes the client and server tests, how they work, how to write one and how to use them.

# Server tests

Here we have test which test the service (e.g. the `project.go` file) as well as the store underneath it.
So we directly work on a real database and can also check whether the SQL statements are working or not.

The interesting part is in the `/server/test` folder where you'll find a `run.sh` script.
Basically this script starts a docker container and runs the tests, because the postgres store tests need this container.

Currently the container is only started once, so this might cause problems when creating new tests because the data in the database changes throughout the test execution.
See issue [#29](https://github.com/hauke96/simple-task-manager/issues/29) for this.

## Write a test

You have to write two golang tests which use one function.

Lets say you want to write the test `TestGetProjects` to test whether the store returns the correct projects.
Then you have to create the functions `TestGetProjects(*testing.T)` which first calls `prepare()` in order to set up the database.
After that, you can write the logic you want to test.

## Run tests

**! IMPORTANT !** All data in your `postgres-data` folder and your `stm-db` docker container will be removed.

* go into `/server/test`
* execute `./run.sh`

# Client tests

Here are normal **Jasmine** tests, which are run in a headless browser using **Karma**.

## Write a test

Normally tests are pre-generated by the Angular CLI but you can also write them by hand.
Each test starts with a `describe` function, which contains the whole test:

```javascript
describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;

  //...
});
```

Within this function, there comes the `beforeEach` function, which is used to set up everything.
This usually looks a lot like this:

```javascript
beforeEach(async(() => {
  TestBed.configureTestingModule({
    declarations: [ YourComponent ],
    imports: [
      SomeDependencyModule
    ]
  })
  .compileComponents();
  
  // Get used service to later mock certain method calls:
  httpClient = TestBed.inject(HttpClient);
}));


beforeEach(() => {
  fixture = TestBed.createComponent(YourComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

And then finally a lot of `it` functions each containing one test:

```javascript
if('should do everything correct', () => {
  // Check that POST request was set up:
  const spy = spyOn(httpClient, 'post');

  const result = component.doSomeStuff();

  expect(result).toEqual('your expected result');
  expect(spy).toHaveBeenCalled();
});
```

## Run tests

* go into the `/client` folder
* run `npm run test`