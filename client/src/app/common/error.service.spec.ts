import { TestBed } from '@angular/core/testing';
import { ErrorService } from './error.service';

fdescribe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly add and get error', () => {
    expect(service.hasError()).toEqual(false);

    service.addError('1');
    expect(service.hasError()).toEqual(true);
    service.addError('2');
    expect(service.hasError()).toEqual(true);
    service.addError('3');
    expect(service.hasError()).toEqual(true);

    expect(service.getError()).toEqual('1');
    service.dropError();
    expect(service.hasError()).toEqual(true);

    expect(service.getError()).toEqual('2');
    service.dropError();
    expect(service.hasError()).toEqual(true);

    expect(service.getError()).toEqual('3');
    service.dropError();
    expect(service.hasError()).toEqual(false);
  });

  it('should return undefined on non existing error', () => {
    service.addError('1');

    expect(service.getError()).toEqual('1');
    service.dropError();
    expect(service.hasError()).toEqual(false);

    expect(service.getError()).toEqual(undefined);
    service.dropError();
    expect(service.hasError()).toEqual(false);
  });
});
