import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FeedbackForm extends LightningElement {
  subject = '';
  rating = '';
  comments = '';

  ratingOptions = [
    { label: '1 - Poor', value: '1' },
    { label: '2 - Fair', value: '2' },
    { label: '3 - Good', value: '3' },
    { label: '4 - Very Good', value: '4' },
    { label: '5 - Excellent', value: '5' }
  ];

  handleSubjectChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.subject = target.value;
  }

  handleRatingChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.rating = target.value;
  }

  handleCommentsChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.comments = target.value;
  }

  handleSubmit(): void {
    if (!this.subject || !this.rating || !this.comments) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'All fields are required.',
          variant: 'error'
        })
      );
      return;
    }

    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Success',
        message: 'Thank you for your feedback!',
        variant: 'success'
      })
    );

    this.resetForm();
  }

  private resetForm(): void {
    this.subject = '';
    this.rating = '';
    this.comments = '';
  }
}