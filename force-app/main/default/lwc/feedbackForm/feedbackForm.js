import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FeedbackForm extends LightningElement {
  name = '';
  email = '';
  rating = '';
  comments = '';
  isSubmitted = false;

  ratingOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' }
  ];

  handleChange(event): void {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;

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

  handleSubmit(event): void {
    event.preventDefault();

    const allValid = [
      ...this.template.querySelectorAll('lightning-input'),
      ...this.template.querySelectorAll('lightning-textarea'),
      ...this.template.querySelectorAll('lightning-combobox')
    ].reduce((validSoFar: boolean, field: HTMLElement) => {
      return (field as any).reportValidity() && validSoFar;
    }, true);

    if (allValid) {
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
}