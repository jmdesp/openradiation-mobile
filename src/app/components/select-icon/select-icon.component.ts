import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectIconOption } from './select-icon-option';

@Component({
  selector: 'app-select-icon',
  templateUrl: './select-icon.component.html',
  styleUrls: ['./select-icon.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectIconComponent),
      multi: true
    }
  ]
})
export class SelectIconComponent implements ControlValueAccessor {
  selectedOption: SelectIconOption | undefined;
  isDisabled: boolean;

  @Input()
  title?: string;

  @Input()
  options: SelectIconOption[];

  // Function to call when the rating changes.
  private onChange = (option: any) => {};

  // Function to call when the input is touched (when a star is clicked).
  private onTouched = () => {};

  registerOnChange(fn: (option: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    const selectedOption = this.options.find(option => option.value === value);
    if (selectedOption && selectedOption.speed) {
      this.selectedOption = this.selectedOption === selectedOption ? undefined : selectedOption;
      this.onChange(this.selectedOption ? this.selectedOption.value : undefined);
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}
