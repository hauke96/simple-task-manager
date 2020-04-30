import { Directive, Input } from '@angular/core';
import { FormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appMinValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: MinValidatorDirective, multi: true}]
})
export class MinValidatorDirective implements Validator {
  @Input()
  public appMinValidator: number;

  constructor() {
  }

  public validate(c: FormControl): { [appMinValidator: string]: any } {
    const v = ('' + c.value).trim();
    return v.match('[-\+]?[0-9]+')
    && (this.appMinValidator <= +v)
      ? null
      : {appMinValidator: true};
  }
}
