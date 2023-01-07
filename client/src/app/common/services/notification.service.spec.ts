import { NotificationService } from './notification.service';

describe(NotificationService.name, () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly add and get error', () => {
    expect(service.hasError()).toEqual(false);

    service.addError('e1');
    service.addWarning('w1');
    service.addInfo('i1');
    expect(service.hasError()).toEqual(true);
    expect(service.hasWarning()).toEqual(true);
    expect(service.hasInfo()).toEqual(true);
    service.addError('e2');
    service.addWarning('w2');
    service.addInfo('i2');
    expect(service.hasError()).toEqual(true);
    expect(service.hasWarning()).toEqual(true);
    expect(service.hasInfo()).toEqual(true);

    expect(service.getError()).toEqual('e1');
    expect(service.getWarning()).toEqual('w1');
    expect(service.getInfo()).toEqual('i1');
    service.dropError();
    service.dropWarning();
    service.dropInfo();
    expect(service.hasError()).toEqual(true);
    expect(service.hasWarning()).toEqual(true);
    expect(service.hasInfo()).toEqual(true);

    expect(service.getError()).toEqual('e2');
    expect(service.getWarning()).toEqual('w2');
    expect(service.getInfo()).toEqual('i2');
    service.dropError();
    service.dropWarning();
    service.dropInfo();
    expect(service.hasError()).toEqual(false);
    expect(service.hasWarning()).toEqual(false);
    expect(service.hasInfo()).toEqual(false);
  });

  it('should return undefined on non existing error', () => {
    service.addError('e1');
    service.addWarning('w1');
    service.addInfo('i1');

    expect(service.getError()).toEqual('e1');
    expect(service.getWarning()).toEqual('w1');
    expect(service.getInfo()).toEqual('i1');
    service.dropError();
    service.dropWarning();
    service.dropInfo();
    expect(service.hasError()).toEqual(false);
    expect(service.hasWarning()).toEqual(false);
    expect(service.hasInfo()).toEqual(false);

    expect(service.getError()).toEqual(undefined);
    expect(service.getWarning()).toEqual(undefined);
    expect(service.getInfo()).toEqual(undefined);
    service.dropError();
    service.dropWarning();
    service.dropInfo();
    expect(service.hasError()).toEqual(false);
    expect(service.hasWarning()).toEqual(false);
    expect(service.hasInfo()).toEqual(false);
  });
});
