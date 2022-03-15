import { MaxValidatorDirective } from './max-validator.directive';
import { FormControl } from '@angular/forms';

describe(MaxValidatorDirective.name, () => {
  it('should create an instance', () => {
    const directive = new MaxValidatorDirective();
    expect(directive).toBeTruthy();
  });

  it('should work on valid values', () => {
    const directive = new MaxValidatorDirective();
    directive.appMaxValidator = 100;

    expect(directive.validate({value: 0} as FormControl)).toEqual(null);
    expect(directive.validate({value: 1} as FormControl)).toEqual(null);
    expect(directive.validate({value: 99} as FormControl)).toEqual(null);
    expect(directive.validate({value: 100} as FormControl)).toEqual(null);
    expect(directive.validate({value: '100'} as FormControl)).toEqual(null);
    expect(directive.validate({value: ' 100 '} as FormControl)).toEqual(null);
    expect(directive.validate({value: -1} as FormControl)).toEqual(null);
  });

  it('should work on invalid values', () => {
    const directive = new MaxValidatorDirective();
    directive.appMaxValidator = 100;

    expect(directive.validate({value: 101} as FormControl)).toEqual({appMaxValidator: true});
    expect(directive.validate({value: ''} as FormControl)).toEqual({appMaxValidator: true});
    expect(directive.validate({value: null} as FormControl)).toEqual({appMaxValidator: true}); // works
    expect(directive.validate({value: undefined} as FormControl)).toEqual({appMaxValidator: true}); // works
    expect(directive.validate({value: '1d'} as FormControl)).toEqual({appMaxValidator: true}); // works
  });
});
