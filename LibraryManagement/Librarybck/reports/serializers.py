from rest_framework import serializers

class ReportDateFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "start_date must be on or before end_date."
            )

        return attrs


class PopularBooksFilterSerializer(serializers.Serializer):
    limit = serializers.IntegerField(
        required=False,
        default=10,
        min_value=1,
        max_value=100,
    )
