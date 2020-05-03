import { Directive, Input } from '@angular/core';
import { FormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appMaxValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: MaxValidatorDirective, multi: true}]
})
export class MaxValidatorDirective implements Validator {
  @Input()
  public appMaxValidator: number;

  constructor() {
  }

  public validate(c: FormControl): { [appMaxValidator: string]: any } {
    const v = ('' + c.value).trim();
    return v.match('[-\+]?[0-9]+')
    && (+v <= this.appMaxValidator)
      ? null
      : {appMaxValidator: true};
  }
}
