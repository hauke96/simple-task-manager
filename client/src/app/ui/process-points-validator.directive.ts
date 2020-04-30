import { Directive, Input } from '@angular/core';
import { FormControl, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
  selector: '[appProcessPointsValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: ProcessPointsValidatorDirective, multi: true}]
})
export class ProcessPointsValidatorDirective implements Validator {
  @Input()
  private appProcessPointsValidator: number;

  constructor() {
  }

  public validate(c: FormControl): { [appProcessPointsValidator: string]: any } {
    const v = c.value;
    return v != null
      && v !== undefined
      && !isNaN(v)
      && (0 <= v)
      && (v <= this.appProcessPointsValidator)
      ? null
      : {appProcessPointsValidator: true};
  }
}
