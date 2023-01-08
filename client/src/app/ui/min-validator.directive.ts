import { Directive, Input } from '@angular/core';
import { UntypedFormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appMinValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: MinValidatorDirective, multi: true}]
})
export class MinValidatorDirective implements Validator {
  private appMinValidatorNumber: number;

  constructor() {
  }

  @Input()
  set appMinValidator(value: number | string) {
    this.appMinValidatorNumber = +value;
  }

  public validate(c: UntypedFormControl): { [appMinValidator: string]: any } | null {
    const v = ('' + c.value).trim();
    return v.match('[-\+]?[0-9]+')
    && (this.appMinValidatorNumber <= +v)
      ? null
      : {appMinValidator: true};
  }
}
