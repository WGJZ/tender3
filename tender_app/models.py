class Bid(models.Model):
    # ... 其他字段 ...
    documents = models.FileField(
        upload_to='bids/%Y/%m/%d/',
        max_length=255
    ) 