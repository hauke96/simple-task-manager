import { Directive, Input } from '@angular/core';
import { UntypedFormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appMaxValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: MaxValidatorDirective, multi: true}]
})
export class MaxValidatorDirective implements Validator {
  private appMaxValidatorNumber: number;

  constructor() {
  }

  @Input()
  set appMaxValidator(value: number | string) {
    this.appMaxValidatorNumber = +value;
  }

  public validate(c: UntypedFormControl): { [appMaxValidator: string]: any } | null {
    const v = ('' + c.value).trim();
    return v.match('[-\+]?[0-9]+')
    && (+v <= this.appMaxValidatorNumber)
      ? null
      : {appMaxValidator: true};
  }
}
