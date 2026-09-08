import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FeedbackForm extends LightningElement {
  public name: string = '';
  public email: string = '';
  public rating: string = '';
  public comments: string = '';
  public isSubmitted: boolean = false;

  public ratingOptions: Array<{ label: string; value: string }> = [
    { label: '1 - Poor', value: '1' },
    { label: '2 - Fair', value: '2' },
    { label: '3 - Good', value: '3' },
    { label: '4 - Very Good', value: '4' },
    { label: '5 - Excellent', value: '5' }
  ];

  public handleChange(event: Event): void {
    const target = event.target as HTMLInputElement & HTMLTextAreaElement;
    const fieldName = target.name;
    const fieldValue = target.value;

    if (fieldName === 'name') {
      this.name = fieldValue;
    } else if (fieldName === 'email') {
      this.email = fieldValue;
    } else if (fieldName === 'rating') {
      this.rating = fieldValue;
    } else if (fieldName === 'comments') {
      this.comments = fieldValue;
    }
  }

  public handleSubmit(): void {
    const allInputs = this.template.querySelectorAll('input, textarea');
    let isFormValid = true;

    allInputs.forEach((input: Element) => {
      const inputElement = input as HTMLInputElement & HTMLTextAreaElement;
      if (!inputElement.checkValidity()) {
        isFormValid = false;
        inputElement.reportValidity();
      }
    });

    if (isFormValid) {
      this.isSubmitted = true;
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Thank you!',
          message: 'Your feedback has been submitted.',
          variant: 'success'
        })
      );
    }
  }

  public handleReset(): void {
    this.name = '';
    this.email = '';
    this.rating = '';
    this.comments = '';
    this.isSubmitted = false;

    const allInputs = this.template.querySelectorAll('input, textarea');
    allInputs.forEach((input: Element) => {
      const inputElement = input as HTMLInputElement & HTMLTextAreaElement;
      inputElement.value = '';
    });
  }
}