# 原MySQL版本
id = models.AutoField(primary_key=True)
amount = models.PositiveIntegerField()

# PostgreSQL版本
id = models.AutoField(primary_key=True)  # 无需修改，Django会自动处理
amount = models.IntegerField(validators=[MinValueValidator(0)]) 
created_at = models.DateTimeField(auto_now_add=True) 