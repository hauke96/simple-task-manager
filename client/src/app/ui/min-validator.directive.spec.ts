import { MinValidatorDirective } from './min-validator.directive';
import { FormControl } from '@angular/forms';

describe('MinValidatorDirective', () => {
  it('should create an instance', () => {
    const directive = new MinValidatorDirective();
    expect(directive).toBeTruthy();
  });

  it('should work on valid values', () => {
    const directive = new MinValidatorDirective();
    directive.appMinValidator = 100;

    expect(directive.validate({value: 100} as FormControl)).toEqual(null);
    expect(directive.validate({value: 101} as FormControl)).toEqual(null);
    expect(directive.validate({value: '100'} as FormControl)).toEqual(null);
    expect(directive.validate({value: ' 100 '} as FormControl)).toEqual(null);

  });

  it('should work on invalid values', () => {
    const directive = new MinValidatorDirective();
    directive.appMinValidator = 100;

    expect(directive.validate({value: 0} as FormControl)).toEqual({appMinValidator: true});
    expect(directive.validate({value: 1} as FormControl)).toEqual({appMinValidator: true});
    expect(directive.validate({value: 99} as FormControl)).toEqual({appMinValidator: true});
    expect(directive.validate({value: -1} as FormControl)).toEqual({appMinValidator: true});
    expect(directive.validate({value: ''} as FormControl)).toEqual({appMinValidator: true});
    expect(directive.validate({value: null} as FormControl)).toEqual({appMinValidator: true}); // works
    expect(directive.validate({value: undefined} as FormControl)).toEqual({appMinValidator: true}); // works
    expect(directive.validate({value: '1d'} as FormControl)).toEqual({appMinValidator: true}); // works
  });
});
