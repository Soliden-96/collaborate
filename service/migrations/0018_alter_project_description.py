# Generated by Django 5.0.4 on 2024-04-14 16:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('service', '0017_project_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='description',
            field=models.TextField(max_length=512, null=True),
        ),
    ]