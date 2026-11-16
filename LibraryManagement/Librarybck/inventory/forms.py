from django import forms
from core.models import Shelf, BookCopy

class ShelfForm(forms.ModelForm):
    class Meta:
        model = Shelf
        fields = [
            "name",
            "location",
            "description",
        ]

class BookCopyForm(forms.ModelForm):
    class Meta:
        model = BookCopy
        fields = [
            "book",
            "barcode",
            "shelf",
            "status",
            "condition",
            "acquisition_date",
            "acquisition_price",
            "notes",
        ]
        widgets = {
            "acquisition_date": forms.DateInput(
                attrs={"type": "date"}
            ),
            "notes": forms.Textarea(
                attrs={"rows": 3}
            ),
        }

    def clean_barcode(self):
        barcode = self.cleaned_data["barcode"].strip()

        if not barcode:
            raise forms.ValidationError(
                "A barcode is required."
            )

        return barcode
